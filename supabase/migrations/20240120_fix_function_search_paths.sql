-- 既存の関数を削除して、search_pathを設定した関数に置き換える

-- update_semifinals_info_updated_at
DROP FUNCTION IF EXISTS public.update_semifinals_info_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION public.update_semifinals_info_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- set_semifinals_info_created_by
DROP FUNCTION IF EXISTS public.set_semifinals_info_created_by() CASCADE;
CREATE OR REPLACE FUNCTION public.set_semifinals_info_created_by()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.created_by = auth.uid();
  RETURN NEW;
END;
$$;

-- update_finals_info_updated_at
DROP FUNCTION IF EXISTS public.update_finals_info_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION public.update_finals_info_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- set_finals_info_created_by
DROP FUNCTION IF EXISTS public.set_finals_info_created_by() CASCADE;
CREATE OR REPLACE FUNCTION public.set_finals_info_created_by()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.created_by = auth.uid();
  RETURN NEW;
END;
$$;

-- update_applications_info_updated_at
DROP FUNCTION IF EXISTS public.update_applications_info_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION public.update_applications_info_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- set_applications_info_created_by
DROP FUNCTION IF EXISTS public.set_applications_info_created_by() CASCADE;
CREATE OR REPLACE FUNCTION public.set_applications_info_created_by()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.created_by = auth.uid();
  RETURN NEW;
END;
$$;

-- update_basic_info_updated_at
DROP FUNCTION IF EXISTS public.update_basic_info_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION public.update_basic_info_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- set_basic_info_created_by
DROP FUNCTION IF EXISTS public.set_basic_info_created_by() CASCADE;
CREATE OR REPLACE FUNCTION public.set_basic_info_created_by()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.created_by = auth.uid();
  RETURN NEW;
END;
$$;

-- update_entries_updated_at
DROP FUNCTION IF EXISTS public.update_entries_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION public.update_entries_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- set_entries_created_by
DROP FUNCTION IF EXISTS public.set_entries_created_by() CASCADE;
CREATE OR REPLACE FUNCTION public.set_entries_created_by()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.created_by = auth.uid();
  RETURN NEW;
END;
$$;

-- update_sns_info_updated_at
DROP FUNCTION IF EXISTS public.update_sns_info_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION public.update_sns_info_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- set_sns_info_created_by
DROP FUNCTION IF EXISTS public.set_sns_info_created_by() CASCADE;
CREATE OR REPLACE FUNCTION public.set_sns_info_created_by()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.created_by = auth.uid();
  RETURN NEW;
END;
$$;

-- update_preliminary_info_audit
DROP FUNCTION IF EXISTS public.update_preliminary_info_audit() CASCADE;
CREATE OR REPLACE FUNCTION public.update_preliminary_info_audit()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- set_preliminary_info_created_by
DROP FUNCTION IF EXISTS public.set_preliminary_info_created_by() CASCADE;
CREATE OR REPLACE FUNCTION public.set_preliminary_info_created_by()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.created_by = auth.uid();
  RETURN NEW;
END;
$$;

-- update_program_info_updated_at
DROP FUNCTION IF EXISTS public.update_program_info_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION public.update_program_info_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- トリガーを再作成（必要に応じて）
-- semifinals_info
CREATE TRIGGER update_semifinals_info_updated_at BEFORE UPDATE ON public.semifinals_info
  FOR EACH ROW EXECUTE FUNCTION public.update_semifinals_info_updated_at();

CREATE TRIGGER set_semifinals_info_created_by BEFORE INSERT ON public.semifinals_info
  FOR EACH ROW EXECUTE FUNCTION public.set_semifinals_info_created_by();

-- finals_info
CREATE TRIGGER update_finals_info_updated_at BEFORE UPDATE ON public.finals_info
  FOR EACH ROW EXECUTE FUNCTION public.update_finals_info_updated_at();

CREATE TRIGGER set_finals_info_created_by BEFORE INSERT ON public.finals_info
  FOR EACH ROW EXECUTE FUNCTION public.set_finals_info_created_by();

-- applications_info
CREATE TRIGGER update_applications_info_updated_at BEFORE UPDATE ON public.applications_info
  FOR EACH ROW EXECUTE FUNCTION public.update_applications_info_updated_at();

CREATE TRIGGER set_applications_info_created_by BEFORE INSERT ON public.applications_info
  FOR EACH ROW EXECUTE FUNCTION public.set_applications_info_created_by();

-- basic_info
CREATE TRIGGER update_basic_info_updated_at BEFORE UPDATE ON public.basic_info
  FOR EACH ROW EXECUTE FUNCTION public.update_basic_info_updated_at();

CREATE TRIGGER set_basic_info_created_by BEFORE INSERT ON public.basic_info
  FOR EACH ROW EXECUTE FUNCTION public.set_basic_info_created_by();

-- entries
CREATE TRIGGER update_entries_updated_at BEFORE UPDATE ON public.entries
  FOR EACH ROW EXECUTE FUNCTION public.update_entries_updated_at();

CREATE TRIGGER set_entries_created_by BEFORE INSERT ON public.entries
  FOR EACH ROW EXECUTE FUNCTION public.set_entries_created_by();

-- sns_info
CREATE TRIGGER update_sns_info_updated_at BEFORE UPDATE ON public.sns_info
  FOR EACH ROW EXECUTE FUNCTION public.update_sns_info_updated_at();

CREATE TRIGGER set_sns_info_created_by BEFORE INSERT ON public.sns_info
  FOR EACH ROW EXECUTE FUNCTION public.set_sns_info_created_by();

-- preliminary_info
CREATE TRIGGER update_preliminary_info_audit BEFORE UPDATE ON public.preliminary_info
  FOR EACH ROW EXECUTE FUNCTION public.update_preliminary_info_audit();

CREATE TRIGGER set_preliminary_info_created_by BEFORE INSERT ON public.preliminary_info
  FOR EACH ROW EXECUTE FUNCTION public.set_preliminary_info_created_by();

-- program_info
CREATE TRIGGER update_program_info_updated_at BEFORE UPDATE ON public.program_info
  FOR EACH ROW EXECUTE FUNCTION public.update_program_info_updated_at();